// scripts/increment.ts
import "dotenv/config";
import * as anchor from "@coral-xyz/anchor";
import fs from "fs";

const httpUrl = process.env.RPC_URL!;
const wsUrl = process.env.WS_URL!;
const keypair = process.env.KEYPAIR_PATH!;
const programId = new anchor.web3.PublicKey(process.env.PROGRAM_ID!);
const counterPda = new anchor.web3.PublicKey(process.env.COUNTER_PDA!);

// 1. 连接
const connection = new anchor.web3.Connection(httpUrl, {
  commitment: "confirmed",
  wsEndpoint: wsUrl, // 若 WS 超时可删掉此行
});

// 2. 钱包
const secretKey = JSON.parse(fs.readFileSync(keypair, "utf8"));
const wallet = new anchor.Wallet(
  anchor.web3.Keypair.fromSecretKey(new Uint8Array(secretKey))
);

// 3. Provider（⚠️ 这一行决定编译类型）
const provider = new anchor.AnchorProvider(connection, wallet, {
  commitment: "confirmed",
});
anchor.setProvider(provider); // ← 一定是 provider

// 4. Program
const idl = JSON.parse(
  fs.readFileSync("./target/idl/counter_anchor.json", "utf8")
);
const program = new anchor.Program(idl as anchor.Idl, programId);

// 5. 调用 increment
(async () => {
  const sig = await program.methods
    .increment()
    .accounts({ counter: counterPda })
    .rpc();
  console.log("Tx:", sig);

  const tx = await connection.getTransaction(sig, { commitment: "confirmed" });
  tx?.meta?.logMessages?.forEach((l) => console.log(l));
})();
