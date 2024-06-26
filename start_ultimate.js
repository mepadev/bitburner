async function traverseAndCollect(ns, root, player_info, maxDepth = 100) {
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
  ns.killall("home", true);

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
  const target =      {
    "hostname": "netlink",
    "ip": "0.4.4.9",
    "sshPortOpen": false,
    "ftpPortOpen": false,
    "smtpPortOpen": false,
    "httpPortOpen": false,
    "sqlPortOpen": false,
    "hasAdminRights": false,
    "cpuCores": 1,
    "isConnectedTo": false,
    "ramUsed": 0,
    "maxRam": 32,
    "organizationName": "NetLink Technologies",
    "purchasedByPlayer": false,
    "backdoorInstalled": false,
    "baseDifficulty": 75,
    "hackDifficulty": 75,
    "minDifficulty": 25,
    "moneyAvailable": 275000000,
    "moneyMax": 6875000000,
    "numOpenPortsRequired": 3,
    "openPortCount": 0,
    "requiredHackingSkill": 423,
    "serverGrowth": 47
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

  ns.exec("ultimate_purchase_server.js","home", 1, target.hostname);
}