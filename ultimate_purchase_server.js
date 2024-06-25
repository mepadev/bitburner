/** @param {NS} ns */
export async function main(ns) {
  const target = ns.args[0];

  // Server job
  const max_server = ns.getPurchasedServerLimit();
  const purchased_servers = ns.getPurchasedServers();

  // Run farm.js on Servers
  purchased_servers.forEach((server) => {
    const server_info = ns.getServer(server);

    try {
      ns.scp("farm.js", server, "home");

      let threads = Math.trunc((server_info.maxRam - server_info.ramUsed) / 2.40);
      ns.exec("farm.js", server, threads, target);
    } catch (err) {
      ns.print(err);
    }
  })

  // Buy Servers
  let i = 0;
  while (purchased_servers.length < max_server) {
    if (ns.getServerMoneyAvailable("home") > ns.getPurchasedServerCost(8)) {
      try {
        ns.tprint("Buying a server.");
        let hostname = ns.purchaseServer(("pserv-" + i), 8);
        purchased_servers.push(ns.getServer(hostname));
        ns.scp("farm.js", hostname, "home");

        let threads = Math.trunc(8 / 2.40);
        ns.exec("farm.js", hostname, threads, target);
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
          ns.exec("farm.js", server_info.hostname, threads, target);
        }
      }
    });

    await ns.sleep(1000 * 60 * 10);
  }
}