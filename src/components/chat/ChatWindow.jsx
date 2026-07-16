import { Fragment } from 'react';
import EmptyState from '../common/EmptyState';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

function ChatWindow({
  conversation,
  users,
  currentUser,
  onSendMessage,
  onEditGroup,
  onOpenProfile,
  onArchiveConversation,
  onRestoreConversation,
}) {
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
  let previousDate = '';

  const getDateKey = (value) => {
    const date = new Date(value);
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  };

  const formatDateLabel = (value) => {
    const date = new Date(value);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const key = getDateKey(date);
    if (key === getDateKey(today)) return 'Hoje';
    if (key === getDateKey(yesterday)) return 'Ontem';
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(date);
  };

  return (
    <section className="chat-window">
      <ChatHeader
        conversation={conversation}
        participants={participants}
        onEditGroup={onEditGroup}
        onOpenProfile={onOpenProfile}
        onArchiveConversation={onArchiveConversation}
        onRestoreConversation={onRestoreConversation}
      />

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

          const messageDate = getDateKey(message.createdAt);
          const showDate = messageDate !== previousDate;
          previousDate = messageDate;

          return (
            <Fragment key={message.id}>
              {showDate ? <div className="message-date-separator"><span>{formatDateLabel(message.createdAt)}</span></div> : null}
              <MessageBubble message={message} own={own} readLabel={readLabel} />
            </Fragment>
          );
        })}
      </div>

      <MessageInput disabled={!conversation} onSend={(message) => onSendMessage(conversation.id, message)} />
    </section>
  );
}

export default ChatWindow;
