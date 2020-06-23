import React from "react";
import { parse } from "graphql";
import { Query, Mutation } from "react-apollo";

const EVENTS = parse(/* GraphQL */ `
  query allEvents {
    events {
      id
      name
      description
    }
  }
`);

const ADD_EVENT = parse(/* GraphQL */ `
  mutation newEvent($name: String!, $description: String) {
    addEvent(name: $name, description: $description) {
      id
      name
      description
    }
  }
`);

function NewEvent() {
  return (
    <Mutation mutation={ADD_EVENT}>
      {(mutate: any) => {
        return (
          <div>
            <button
              onClick={() =>
                mutate({
                  variables: {
                    name: "Random event",
                    description: "" + Math.random(),
                  },
                })
              }
            >
              Add random event
            </button>
          </div>
        );
      }}
    </Mutation>
  );
}

export default function Calendar() {
  return (
    <div>
      <h2>Events</h2>
      <NewEvent />
      <Query
        query={EVENTS}
        fetchPolicy="network-only"
        children={({ loading, data }: any) => {
          if (loading) {
            return <div>Loading...</div>;
          }

          return (
            <ul>
              {data.events.map((event: any) => {
                return (
                  <li key={event.id}>
                    <h3>{event.name}</h3>
                    <p>{event.description}</p>
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
