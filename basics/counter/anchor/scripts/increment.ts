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

// ---------- 5. 读取已保存的 Counter pubkey ----------
const counterSecret = JSON.parse(
  fs.readFileSync("./counter-keypair.json", "utf8")
);
const counterPubkey = anchor.web3.Keypair.fromSecretKey(
  new Uint8Array(counterSecret)
).publicKey;

console.log("Counter pubkey:", counterPubkey.toBase58());

// ---------- 6. 调用 increment ----------
(async () => {
  const sig = await program.methods
    .increment()
    .accounts({ counter: counterPubkey })
    .rpc();

  console.log("Increment tx:", sig);

  // 可选：打印日志
  const tx = await connection.getTransaction(sig, { commitment: "confirmed" });
  tx?.meta?.logMessages?.forEach((l) => console.log(l));
})();
