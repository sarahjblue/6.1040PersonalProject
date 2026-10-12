import { User } from "./MITUserVerification.ts"

type Session = {
    user: User
}

export class SessiongingConcept {
    private readonly sessions: Session[] = [];

    sessionOpen(user: User): Session {
        const session = this.sessions.filter((session) => session.user === user)[0];

        if(!session){
            const newSession = {user: user};
            return newSession;
        }

        return session;
    }
}
