/**
 * ChatyPlayer v1.0
 * Entry Point (Production Ready)
 * ----------------------------------------
 * - React safe (no auto-init conflicts)
 * - Optional auto-init support (disabled by default)
 * - Prevents duplicate initialization
 * - Secure config parsing
 * - CSS bundled safely
 */
import "./styles/chatyplayer.css";
import { Player } from "./core/Player";
declare global {
    interface Window {
        ChatyPlayer?: ChatyPlayerAPI;
    }
}
type ChatyPlayerAPI = {
    create: (container: HTMLElement) => Player | null;
    autoInit: () => void;
    version: string;
};
declare const ChatyPlayer: ChatyPlayerAPI;
export default ChatyPlayer;
