import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';

function ChatLayout({
  conversations,
  users,
  currentUser,
  activeConversation,
  activeConversationId,
  onSelectConversation,
  onSendMessage,
  onNewGroup,
  onOpenProfile,
}) {
  return (
    <section className="chat-layout">
      <ChatSidebar
        conversations={conversations}
        users={users}
        currentUser={currentUser}
        activeConversationId={activeConversationId}
        onSelectConversation={onSelectConversation}
        onNewGroup={onNewGroup}
      />
      <ChatWindow
        conversation={activeConversation}
        users={users}
        currentUser={currentUser}
        onSendMessage={onSendMessage}
        onOpenProfile={onOpenProfile}
      />
    </section>
  );
}

export default ChatLayout;
