/** @param {NS} ns */
export async function main(ns) {
  // Defines the "target server", which is the server
  // that we're going to hack. In this case, it's "n00dles"
  const target = ns.args[0];

  // Defines how much money a server should have before we hack it
  // In this case, it is set to the maximum amount of money.
  const moneyThresh = ns.getServerMaxMoney(target);
  ns.print("Target = " + target);

  // Defines the maximum security level the target server can
  // have. If the target's security level is higher than this,
  // we'll weaken it before doing anything else
  const securityThresh = ns.getServerMinSecurityLevel(target);

  // Infinite loop that continously hacks/grows/weakens the target server
  while (true) {
    if (ns.getServerSecurityLevel(target) > securityThresh) {
      // If the server's security level is above our threshold, weaken it
      ns.print("weakening")
      await ns.weaken(target);
    } else if (ns.getServerMoneyAvailable(target) < moneyThresh) {
      // If the server's money is less than our threshold, grow it
      ns.print("growing")
      await ns.grow(target);
    } else {
      // Otherwise, hack it
      ns.print("hacking")
      await ns.hack(target);
    }
  }
}