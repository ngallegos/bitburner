
/** @param {NS} ns */
export async function main(ns) {

    let ram = 1048;
    let cost = ns.getPurchasedServerCost(ram);

    let hackRam = ns.getScriptRam("hack-template.js");
    ns.tprint(`${ram} GB servers cost ${cost}`)
    let buyServers = function (ns)
    {
      // Iterator we'll use for our loop
      let i = ns.scan().filter(s => s.startsWith('pserv-')).length;
      if (i < ns.getPurchasedServerLimit()){
        // Check if we have enough money to purchase a server
        if (ns.getServerMoneyAvailable("home") > cost) {
          // If we have enough money, then:
          //  1. Purchase the server
          //  2. Copy our hacking script onto the newly-purchased server
          //  3. Run our hacking script on the newly-purchased server with 3 threads
          //  4. Increment our iterator to indicate that we've bought a new server
          let hostname = ns.purchaseServer("pserv-" + i, ram);
          ns.scp("hack-template.js", hostname);
          ns.exec("hack-template.js", hostname, Math.floor(ram / hackRam));
          ++i;

          var timeSinceReset = Date.now() - ns.getResetInfo().lastAugReset;
          //ns.tprint(`Purchased server ${i} of ${ns.getPurchasedServerLimit()} ${timeSinceReset/60000} min after augmentation`)
        }
      }
    }

    var nodes = ns.hacknet.numNodes();
    while (true){
      var serverMoney = ns.getServerMoneyAvailable("home");
      if (serverMoney > ns.hacknet.getPurchaseNodeCost()) {
        nodes = ns.hacknet.purchaseNode() + 1;
        //ns.tprint(`Purchased new hacknet node: hacknet-node-${nodes - 1}`);
      } else {
        //ns.tprint(nodes);
        for (var node = 0; node < nodes; node++){
          //ns.tprint(nodeStats);
          var nodeStats = ns.hacknet.getNodeStats(node);
          if (ns.hacknet.upgradeLevel(node)){
            //ns.tprint(`Upgraded hacknet node level for ${nodeStats.name} (${nodeStats.level} -> ${nodeStats.level + 1})`);
          } else if (ns.hacknet.upgradeRam(node)) {
            //ns.tprint(`Upgraded hacknet ram for ${nodeStats.name} (${nodeStats.ram} -> ${ns.hacknet.getNodeStats(node).ram})`);
          } else if (ns.hacknet.upgradeCore(node)){
            //ns.tprint(`Upgraded hacknet ram for ${nodeStats.name} (${nodeStats.cores} -> ${ns.hacknet.getNodeStats(node).cores})`);
          } else {
            buyServers(ns);
          }
        }
      }
      await ns.sleep(250);
    }
}