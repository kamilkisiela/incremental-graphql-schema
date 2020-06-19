import React from "react";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Home = React.lazy(() => import("./chunks/home"));
const Chats = React.lazy(() => import("./chunks/chats"));
const Calendar = React.lazy(() => import("./chunks/calendar"));
const Both = React.lazy(() => import("./chunks/chats-and-calendar"));

function App() {
  const [page, setPage] = React.useState<
    "home" | "chats" | "calendar" | "both"
  >("home");

  return (
    <>
      <div>
        <button onClick={() => setPage("home")}>Home</button>
        <button onClick={() => setPage("chats")}>Chats</button>
        <button onClick={() => setPage("calendar")}>Calendar</button>
        <button onClick={() => setPage("both")}>
          Chats and Calendar on one screen
        </button>
      </div>
      <React.Suspense fallback={<div>Loading</div>}>
        <div>
          {page === "chats" ? (
            <Chats />
          ) : page === "calendar" ? (
            <Calendar />
          ) : page === "both" ? (
            <Both />
          ) : (
            <Home />
          )}
        </div>
      </React.Suspense>
      <ToastContainer />
    </>
  );
}

export default App;
