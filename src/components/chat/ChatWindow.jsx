import EmptyState from '../common/EmptyState';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

function ChatWindow({ conversation, users, currentUser, onSendMessage, onOpenProfile }) {
  if (!conversation) {
    return (
      <section className="chat-window empty-chat-window">
        <EmptyState
          title="Selecione uma conversa"
          description="Abra uma conversa individual ou grupo para visualizar mensagens e responder."
        />
      </section>
    );
  }

  const participants = users.filter(
    (user) => conversation.participantIds.includes(user.id) && user.id !== currentUser.id,
  );
  const readTargetCount = participants.length;

  return (
    <section className="chat-window">
      <ChatHeader conversation={conversation} participants={participants} onOpenProfile={onOpenProfile} />

      <div className="messages-list">
        {conversation.messages.map((message) => {
          const own = message.senderId === currentUser.id;
          const readCount = message.readBy?.length ?? 0;
          const readLabel = own
            ? readTargetCount > 1
              ? `${readCount}/${readTargetCount} visualizaram`
              : readCount > 0
                ? 'Visualizada'
                : 'Enviada'
            : '';

          return <MessageBubble key={message.id} message={message} own={own} readLabel={readLabel} />;
        })}
      </div>

      <MessageInput disabled={!conversation} onSend={(message) => onSendMessage(conversation.id, message)} />
    </section>
  );
}

export default ChatWindow;
