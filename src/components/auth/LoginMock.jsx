import { useAuth } from '../../contexts/AuthContext';
import { loadMembers } from '../../utils/membersUtils';

function LoginMock() {
  const { currentUser, setCurrentUser, isAdmin } = useAuth();
  const members = loadMembers();

  return (
    <section className="login-mock-panel">
      <div>
        <p className="eyebrow">Sessão mockada</p>
        <h3>{currentUser.name}</h3>
        <p>{currentUser.email}</p>
      </div>
      <label>
        <span>Entrar como</span>
        <select
          value={currentUser.email}
          onChange={(event) => {
            const nextUser = members.find((member) => member.email === event.target.value);
            if (nextUser) setCurrentUser(nextUser);
          }}
        >
          {members.map((member) => (
            <option key={member.id} value={member.email}>
              {member.name}
            </option>
          ))}
        </select>
      </label>
      <span className={`member-type-badge ${isAdmin ? 'admin' : 'member'}`}>
        {isAdmin ? 'Admin' : 'Membro'}
      </span>
    </section>
  );
}

export default LoginMock;
