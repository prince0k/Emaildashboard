import { NodeSSH } from "node-ssh";

const ssh = new NodeSSH();

async function test() {

  await ssh.connect({
    host: "148.113.192.105",
    username: "root",
    password: "Jakchets12345*Jak22"
  });

  const result = await ssh.execCommand("pmta show status");

  console.log(result.stdout);

  ssh.dispose();
}

test();