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
  onNewContact,
  onNewGroup,
  onEditGroup,
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
        onNewContact={onNewContact}
        onNewGroup={onNewGroup}
      />
      <ChatWindow
        conversation={activeConversation}
        users={users}
        currentUser={currentUser}
        onSendMessage={onSendMessage}
        onEditGroup={onEditGroup}
        onOpenProfile={onOpenProfile}
      />
    </section>
  );
}

export default ChatLayout;
