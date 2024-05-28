async function traverseAndCollect(ns, root, player_info, maxDepth = 10) {
  const queue = [{ node: root, depth: 0 }];
  const serverData = [];
  const visited = new Set();

  while (queue.length > 0) {
    const { node, depth } = queue.shift();

    if (depth > maxDepth || visited.has(node)) continue;

    visited.add(node);

    const server = ns.getServer(node);
    if (server.requiredHackingSkill <= player_info.hacking_skill && server.numOpenPortsRequired <= player_info.program_count) {
      serverData.push(server);
    }

    const connectedServers = ns.scan(node);
    for (const connectedServer of connectedServers) {
      if (!visited.has(connectedServer)) {
        queue.push({ node: connectedServer, depth: depth + 1 });
      }
    }
  }

  return serverData;
}

function sortServersByMoneyMax(serverData) {
  return Object.values(serverData)
    .sort((a, b) => b.moneyMax - a.moneyMax);
}

/** @param {NS} ns */
export async function main(ns) {
  const programs = ["BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"];
  //Player Info
  const player_info = {
    program_count: 0,
    hacking_skill: ns.getHackingLevel(),
  }
  programs.forEach((element) => {
    if (ns.fileExists(element, "home")) {
      player_info.program_count += 1;
    }
  })

  // Call the function
  const all_servers = await traverseAndCollect(ns, 'home', player_info);
  const sorted_server = sortServersByMoneyMax(all_servers);

  // Select the most valuable server and remove from the list
  const target = {
    "hostname": "harakiri-sushi",
    "ip": "85.9.1.5",
    "sshPortOpen": true,
    "ftpPortOpen": true,
    "smtpPortOpen": true,
    "httpPortOpen": false,
    "sqlPortOpen": false,
    "hasAdminRights": true,
    "cpuCores": 1,
    "isConnectedTo": false,
    "ramUsed": 14.4,
    "maxRam": 16,
    "organizationName": "HaraKiri Sushi Bar Network",
    "purchasedByPlayer": false,
    "backdoorInstalled": false,
    "baseDifficulty": 15,
    "hackDifficulty": 15,
    "minDifficulty": 5,
    "moneyAvailable": 4000000,
    "moneyMax": 100000000,
    "numOpenPortsRequired": 0,
    "openPortCount": 3,
    "requiredHackingSkill": 40,
    "serverGrowth": 40
  }

  sorted_server.forEach((server) => {
    ns.scriptKill("farm.js", server.hostname);

    // Open the borders
    programs.forEach((program) => {
      switch (program) {
        case 'BruteSSH.exe':
          if (ns.fileExists(program, "home")) {
            ns.brutessh(server.hostname);
          }
          break;
        case 'FTPCrack.exe':
          if (ns.fileExists(program, "home")) {
            ns.ftpcrack(server.hostname);
          }
          break;
        case 'relaySMTP.exe':
          if (ns.fileExists(program, "home")) {
            ns.relaysmtp(server.hostname);
          }
          break;
        case 'HTTPWorm.exe':
          if (ns.fileExists(program, "home")) {
            ns.httpworm(server.hostname);
          }
          break;
        case 'SQLInject.exe':
          if (ns.fileExists(program, "home")) {
            ns.sqlinject(server.hostname);
          }
          break;
      }
    })

    try {
      ns.nuke(server.hostname);

      ns.scp("farm.js", server.hostname, "home");

      let threads = Math.trunc((server.maxRam - server.ramUsed) / 2.40);
      if (threads > 0) {
        ns.exec("farm.js", server.hostname, threads, target.hostname);
      }
    } catch (err) {
      ns.tprint(err);
    }
  });

  // Server job
  const max_server = ns.getPurchasedServerLimit();
  const max_ram = ns.getPurchasedServerMaxRam();
  const purchased_servers = ns.getPurchasedServers();

  // Run farm.js on Servers
  purchased_servers.forEach((server) => {
    const server_info = ns.getServer(server);

    try {
      ns.scp("farm.js", server, "home");

      let threads = Math.trunc((server_info.maxRam - server_info.ramUsed) / 2.40);
      ns.exec("farm.js", server, threads, target.hostname);
      ++i;
    } catch (err) {
      ns.print(err);
    }
  })

  // Buy Servers
  while (purchased_servers < max_server) {
    if (ns.getServerMoneyAvailable("home") > ns.getPurchasedServerCost(8)) {
      try {
        let hostname = ns.purchaseServer("pserv-" + i, max_ram);
        ns.scp("farm.js", hostname, "home");

        let threads = Math.trunc(8 / 2.40);
        ns.exec("farm.js", hostname, threads, target.hostname);
        ++i;
      } catch (err) {
        ns.print(err);
      }
    }
    await ns.sleep(5000);
  }

  // Upgrade Servers to infinity
  while (true) {
    purchased_servers.forEach((server) => {
      let server_info = ns.getServer(server);

      let bought = false;
      let loop = false;
      do {
        if (ns.upgradePurchasedServer(server_info.hostname, (server_info.maxRam * 2))) {
          bought = true;
          loop = true;
          server_info = ns.getServer(server);
        } else {
          loop = false;
        }
      } while (loop);

      if (bought) {
        ns.killall(server_info.hostname, true);

        ns.scp("farm.js", server_info.hostname, "home");

        let threads = Math.trunc((server_info.maxRam - server_info.ramUsed) / 2.40);

        if (threads > 0) {
          ns.exec("farm.js", server_info.hostname, threads, target.hostname);
        }
      }
    });

    await ns.sleep(1000 * 60 * 10);
  }
}