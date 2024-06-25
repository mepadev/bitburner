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
  const target =   {
    "hostname": "max-hardware",
    "ip": "19.9.4.8",
    "sshPortOpen": true,
    "ftpPortOpen": true,
    "smtpPortOpen": true,
    "httpPortOpen": true,
    "sqlPortOpen": false,
    "hasAdminRights": true,
    "cpuCores": 1,
    "isConnectedTo": false,
    "ramUsed": 0,
    "maxRam": 32,
    "organizationName": "Max Hardware Store",
    "purchasedByPlayer": false,
    "backdoorInstalled": false,
    "baseDifficulty": 15,
    "hackDifficulty": 15,
    "minDifficulty": 5,
    "moneyAvailable": 10000000,
    "moneyMax": 250000000,
    "numOpenPortsRequired": 1,
    "openPortCount": 4,
    "requiredHackingSkill": 80,
    "serverGrowth": 30
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