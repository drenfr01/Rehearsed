import ChatMessage from "../components/ChatMessage";
import ChatOverview from "../components/ChatOverview";
import ChatInput from "../components/ChatInput";

export default function Simulation() {
  return (
    <section className="hero is-fullheight">
      <div className="hero-head has-text-centered">
        <ChatOverview />
      </div>
      <div className="hero-body">
        <div className="container">
          <ChatMessage />
        </div>
      </div>
      <div className="hero-foot">
        <footer className="section is-small">
          <ChatInput />
        </footer>
      </div>
    </section>
  );
}
