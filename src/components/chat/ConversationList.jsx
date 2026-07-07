import ConversationItem from './ConversationItem';

function ConversationList({ title, conversations, users, currentUser, activeConversationId, onSelect }) {
  return (
    <section className="conversation-section">
      <div className="conversation-section-title">
        <span>{title}</span>
        <strong>{conversations.length}</strong>
      </div>
      <div className="conversation-list">
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            users={users}
            currentUser={currentUser}
            active={activeConversationId === conversation.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}

export default ConversationList;
