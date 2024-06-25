/** @param {NS} ns */
export async function main(ns) {
  const server_number = ns.args[0];
  const script_name = ns.args[1];
  const target = ns.args[2];

  try {
      ns.scp(`scripts/${script_name}.js`, `pserv-${server_number}`, "home");

      const server = ns.getServer(`pserv-${server_number}`);

      let threads = Math.trunc((server.maxRam - server.ramUsed) / 1.75);
      ns.tprint(threads);
      if (threads > 0) {
        ns.exec(`scripts/${script_name}.js`, `pserv-${server_number}`, threads, target);
      }
    } catch (err) {
      ns.tprint(err);
    }
}