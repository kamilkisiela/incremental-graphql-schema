import React from "react";
import { parse } from "graphql";
import { Query } from "react-apollo";

export default function Chats() {
  return (
    <div>
      <h2>Chats</h2>
      <Query
        query={parse(/* GraphQL */ `
          query allChats {
            chats {
              id
              title
              members {
                id
                name
              }
            }
          }
        `)}
        fetchPolicy="network-only"
        children={({ loading, data }: any) => {
          if (loading) {
            return <div>Loading...</div>;
          }

          return (
            <ul>
              {data.chats.map((chat: any) => {
                return (
                  <li key={chat.id}>
                    <h3>{chat.title}</h3>
                    Members: {chat.members.map((m: any) => m.name).join(", ")}
                  </li>
                );
              })}
            </ul>
          );
        }}
      />
    </div>
  );
}
