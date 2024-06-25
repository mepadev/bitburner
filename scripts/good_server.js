async function traverseAndCollect(ns, root, player_info, maxDepth = 100) {
    const queue = [{ node: root, depth: 0 }];
    const serverData = [];
    const visited = new Set();

    while (queue.length > 0) {
        const { node, depth } = queue.shift();

        if (depth > maxDepth || visited.has(node)) continue;

        visited.add(node);

        const server = ns.getServer(node);
        serverData.push(server);
        // if (server.moneyMax > 0 && server.moneyAvailable > 0 && server.requiredHackingSkill <= player_info.hacking_skill && server.numOpenPortsRequired <= player_info.program_count) {
        //     serverData.push(server);
        // }

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


    const allServers = await traverseAndCollect(ns, 'home', player_info);
    const sortedServers = sortServersByMoneyMax(allServers);

    // ns.tprint("SERVERS: " + sortedServers.length)

    // sortedServers.forEach((server) => {
    //     if(!server.backdoorInstalled){
    //     ns.tprint(server.hostname)
    //     }

    // })
    // ns.tprint(JSON.stringify(sortedServers, null, 2)); // Print the collected server data

    // ns.tprint(ns.getServerMaxRam("home"));



    // ns.tprint(ns.getServer("deltaone"));
}



  // // Get player info
  // const player_info = ns.getPlayer();

  // //Server Info
  // function getAllServers(vector, depth) {
  //   if (depth <= 0) return [];

  //   let result = [];

  //   vector.forEach((element, index) => {
  //     if (depth < 5 && index == 0) return;

  //     const el_info = ns.getServer(element);
  //     result.push({
  //       "hostname": el_info.hostname,
  //       "baseDifficulty": el_info.baseDifficulty,
  //       "hackDifficulty": el_info.hackDifficulty,
  //       "minDifficulty": el_info.minDifficulty,
  //       "moneyAvailable": el_info.moneyAvailable,
  //       "moneyMax": el_info.moneyMax,
  //       "serverGrowth": el_info.serverGrowth
  //     });


  //     let el_vector = ns.scan(element);

  //     if (el_vector.length > 0) {
  //       let fragment_vector = getAllServers(el_vector, depth - 1);
  //       result.push(...fragment_vector);
  //     }
  //   });

  //   return result;
  // }

  // const initial_vector = ns.scan('home');
  // const all_servers = getAllServers(initial_vector, 5);

  // // Logging all servers for verification
  // all_servers.forEach(server => ns.tprint(server));