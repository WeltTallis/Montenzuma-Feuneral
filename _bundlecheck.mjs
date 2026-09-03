const esbuild=require("esbuild");
const path=require("path");
void esbuild.build({
  entryPoints:["src/components/leave/Dashboard.jsx"],
  absWorkingDir:"C:\\Users\\User\\Downloads\\restpoint\\FrontendClient\\client",
  bundle:true,
  format:"esm",
  platform:"browser",
  target:"es2020",
  loader:{".js":"jsx",".jsx":"jsx"},
  external:["react","react-dom","styled-components","react-router-dom","axios"].concat(["../../api","../../utils/globalAuth","../../utils/icons/icons"]),
  write:false,
  logLevel:"info"
}).then(r=>{console.log("BUNDLE OK ? "+r.outputFiles[0].code.length+" chars");}).catch(e=>{console.error("BUNDLE ERROR:",e.message);process.exit(1);});
