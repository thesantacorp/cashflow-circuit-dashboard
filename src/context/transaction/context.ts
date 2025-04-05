
import { createContext } from "react";
import { TransactionContextType } from "./types";

export const TransactionContext = createContext<TransactionContextType | undefined>(undefined);
