import crypto from 'crypto';
import { supabaseAdmin } from './supabase';

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function generateTxId(from, to, amount, timestamp) {
  const raw = `${from}:${to}:${amount}:${timestamp}:${Math.random()}`;
  return '0x' + sha256(raw);
}

function generateBlockHash(blockNumber, prevHash, merkleRoot, nonce, timestamp) {
  const raw = `${blockNumber}:${prevHash}:${merkleRoot}:${nonce}:${timestamp}`;
  return sha256(raw);
}

function generateMerkleRoot(txIds) {
  if (!txIds.length) return sha256('empty');
  if (txIds.length === 1) return sha256(txIds[0]);
  const concat = txIds.join('');
  return sha256(concat);
}

export async function getLatestBlock() {
  const { data } = await supabaseAdmin
    .from('blocks')
    .select('*')
    .order('block_number', { ascending: false })
    .limit(1);
  return data?.[0] || null;
}

export async function mineBlock(txIds) {
  const latest = await getLatestBlock();
  const blockNumber = latest ? latest.block_number + 1 : 1;
  const prevHash = latest ? latest.block_hash : '0'.repeat(64);
  const merkleRoot = generateMerkleRoot(txIds);
  const timestamp = Date.now();
  const nonce = Math.floor(Math.random() * 100000);
  const blockHash = generateBlockHash(blockNumber, prevHash, merkleRoot, nonce, timestamp);

  const { data: block } = await supabaseAdmin
    .from('blocks')
    .insert({ block_number: blockNumber, block_hash: blockHash, prev_hash: prevHash, merkle_root: merkleRoot, tx_count: txIds.length, nonce })
    .select()
    .single();

  return block;
}

export async function createTransaction({ fromUser, toUser, amount, type, metadata = {} }) {
  const timestamp = Date.now();
  const txId = generateTxId(fromUser || 'SYSTEM', toUser || 'SYSTEM', amount, timestamp);

  // Mine a block for this transaction
  const block = await mineBlock([txId]);

  const { data: tx, error } = await supabaseAdmin
    .from('ledger')
    .insert({
      tx_id: txId,
      block_hash: block?.block_hash || sha256(txId),
      from_user: fromUser || null,
      to_user: toUser || null,
      amount,
      type,
      status: 'confirmed',
      metadata,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { tx, block };
}

export async function getChain(limit = 10) {
  const { data } = await supabaseAdmin
    .from('blocks')
    .select('*')
    .order('block_number', { ascending: false })
    .limit(limit);
  return data || [];
}
