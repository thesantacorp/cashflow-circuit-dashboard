
import { createContext } from "react";
import { TransactionContextProps } from "./types";

export const TransactionContext = createContext<TransactionContextProps | undefined>(undefined);
