import React from "react";

import Chats from "./chats";
import Calendar from "./calendar";

export default function ChatsAndCalendar() {
  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      <Chats />
      <Calendar />
    </div>
  );
}
