import "dotenv/config";
import * as anchor from "@coral-xyz/anchor";
import fs from "fs";

// ---------- 1. 连接 ----------
const httpUrl = process.env.RPC_URL ?? "http://127.0.0.1:8899";
const wsUrl = process.env.WS_URL ?? "ws://127.0.0.1:8900";
const keypairPath =
  process.env.KEYPAIR_PATH ?? `${process.env.HOME}/.config/solana/id.json`;

const connection = new anchor.web3.Connection(httpUrl, {
  commitment: "confirmed",
  wsEndpoint: wsUrl,
});

// ---------- 2. 钱包 ----------
const secret = JSON.parse(fs.readFileSync(keypairPath, "utf8"));
const wallet = new anchor.Wallet(
  anchor.web3.Keypair.fromSecretKey(new Uint8Array(secret))
);

// ---------- 3. Provider ----------
const provider = new anchor.AnchorProvider(connection, wallet, {
  commitment: "confirmed",
});
anchor.setProvider(provider);

// ---------- 4. Program ----------
const idl = JSON.parse(
  fs.readFileSync("./target/idl/counter_anchor.json", "utf8")
) as anchor.Idl;

const program = new anchor.Program(idl, provider);

// ---------- 5. 计算 Counter PDA ----------
// 按你的合约 seeds 改这里：大多数教程只用 'counter'
// 如果 Initialize 写的是 [b"counter", authority.key()], 把 wallet.publicKey 加进去
const [counterPda] = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("counter")], // <--- 修改 seeds 在这
  program.programId
);

console.log("Counter PDA:", counterPda.toBase58());

// ---------- 6. 调用 increment ----------
(async () => {
  const sig = await program.methods
    .increment()
    .accounts({ counter: counterPda })
    .rpc();

  console.log("Tx:", sig);

  const tx = await connection.getTransaction(sig, { commitment: "confirmed" });
  tx?.meta?.logMessages?.forEach((l) => console.log(l));
})();
