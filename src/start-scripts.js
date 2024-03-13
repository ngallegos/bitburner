/** @param {NS} ns */
export async function main(ns) {
    // Array of all servers that don't need any ports opened
    // to gain root access. These have 16 GB of RAM
    let hackRam = ns.getScriptRam("hack-template.js");
  
    /** @param {Array<Server>} servers */
    const getServers = async function(host = "home", parent = undefined){
      let servers = ns.scan(host)
        .filter(c => c !== parent && !c.startsWith("pserv"))
        .map(c => {
          ns.scriptKill("hack-template.js", c);
          ns.rm("hack-template.js", c);
          return ns.getServer(c);
        });
  
      //ns.tprint(`${host}: ${servers.length} servers`);
      if (servers.length > 0){
        var serverTasks = servers.map(s => getServers(s.hostname, host));
        var serverArrays = await Promise.all(serverTasks);
        serverArrays.forEach(sArray => {
          servers = servers.concat(sArray);
        });
      }
      return servers;
    }
  
    let hackingLevel = ns.getHackingLevel();
    let servers = (await getServers()).sort((a, b) => {
      if (a.hasAdminRights !== b.hasAdminRights){
        return a.hasAdminRights ? -1 : 1;
      }
      if (a.requiredHackingSkill <= hackingLevel 
          && b.requiredHackingSkill <= hackingLevel){
            // pick the highest money
            return b.moneyMax - a.moneyMax;
      }
  
      // otherwise - the lowest hacking level
      return a.requiredHackingSkill - b.requiredHackingSkill;
    });
  
    let bestTarget = servers[0];
  
    ns.tprint(`Found ${servers.length} servers, best target is ${bestTarget.hostname} \$${bestTarget.moneyMax}`);  
    servers.forEach(serv => {
  
      let sInfo = ns.getServer(serv.hostname);
      let ram = sInfo.maxRam - sInfo.ramUsed;
      let possibleThreads = Math.floor(ram/hackRam);
      try {
        ns.scp("hack-template.js", serv.hostname);
        
        ns.print(`${sInfo.hostname} (${possibleThreads}): \n\t${JSON.stringify(sInfo)}`);
        
        if (!sInfo.hasAdminRights 
            && sInfo.requiredHackingSkill <= hackingLevel
            && possibleThreads > 0){
  
          if (ns.fileExists("HTTPWorm.exe", "home") && !sInfo.httpPortOpen)
            ns.httpworm(sInfo.hostname);
  
          if (ns.fileExists("SQLInject.exe", "home") && !sInfo.sqlPortOpen)
            ns.sqlinject(sInfo.hostname)
  
          if (ns.fileExists("BruteSSH.exe", "home") && !sInfo.sshPortOpen)
            ns.brutessh(sInfo.hostname);
  
          if (ns.fileExists("FTPCrack.exe", "home") && !sInfo.ftpPortOpen)
            ns.ftpcrack(sInfo.hostname);
  
          if (ns.fileExists("relaySMTP.exe", "home") && !sInfo.smtpPortOpen)
            ns.relaysmtp(sInfo.hostname);
          sInfo = ns.getServer(sInfo.hostname);
          if (sInfo.numOpenPortsRequired <= sInfo.openPortCount){
            ns.nuke(sInfo.hostname);       
            sInfo = ns.getServer(sInfo.hostname);
          }
        }
  
        if (sInfo.hasAdminRights && possibleThreads > 0){ 
          ns.exec("hack-template.js", sInfo.hostname, Math.floor( ram / hackRam), bestTarget.hostname);
        }   
      } catch {
        ns.tprint(`Error processing '${sInfo.hostname}' (${possibleThreads}):\n\n ${ErrorEvent} \n\n ${JSON.stringify(sInfo)}`);
      }
    });
  
    ns.scriptKill("hack-template.js", "home");
    let homeInfo = ns.getServer("home");
    let homeRam = homeInfo.maxRam - homeInfo.ramUsed;
    let homePossibleThreads = Math.floor(homeRam/hackRam);
    ns.exec("hack-template.js", "home", homePossibleThreads, bestTarget.hostname);
  
    return
  }