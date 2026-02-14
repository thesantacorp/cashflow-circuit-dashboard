
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_user_txid 
ON public.transactions(user_email, transaction_id);
