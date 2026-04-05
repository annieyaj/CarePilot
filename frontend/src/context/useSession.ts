/**
 * Re-export so imports from `./useSession` resolve to the same context as `SessionProvider` in `SessionContext.tsx`.
 * (Do not use `sessionContextBase`’s context here — that instance is not what main.tsx provides.)
 */
export { useSession } from "./SessionContext";
