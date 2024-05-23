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
  const target = sorted_server[0];

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

  purchased_servers.forEach((server) => {
    ns.killall(server);
  })

  let i = 0;
  while (i < max_server && purchased_servers < max_server) {
    // Check if we have enough money to purchase a server
    if (ns.getServerMoneyAvailable("home") > ns.getPurchasedServerCost(max_ram)) {
      // If we have enough money, then:
      //  1. Purchase the server
      //  2. Copy our hacking script onto the newly-purchased server
      //  3. Run our hacking script on the newly-purchased server with 3 threads
      //  4. Increment our iterator to indicate that we've bought a new server
      try {
        let hostname = ns.purchaseServer("pserv-" + i, max_ram);
        ns.scp("farm.js", hostname, "home");

        let threads = Math.trunc(max_ram / 2.40);
        ns.exec("farm.js", hostname, threads, target.hostname);
        ++i;
      } catch (err) {
        ns.print(err);
      }
    }
    //Make the script wait for a second before looping again.
    //Removing this line will cause an infinite loop and crash the game.
    await ns.sleep(5000);
  }

}