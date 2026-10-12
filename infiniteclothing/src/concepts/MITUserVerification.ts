type User = {
    username: string,
    email: string,
    password: string,
    token: string,
    confirmed: boolean
}


export class MITUserVerificationConcept {
    private readonly users: User[] = [];

    private generateRandomString(length: number): string {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            result += characters.charAt(randomIndex);
        }
        return result;
    }


    register(username: string, email: string, password: string) : [User, string] {

        const duplicateUsername = this.users.filter((user) => user.username === username);
        if(duplicateUsername) {
            throw new Error("This username is already used. Choose a new one.");
        }

        const duplicateEmail = this.users.filter((user) => user.email === email);
        if(duplicateEmail){
            throw new Error("This email already has an associated account.");
        }

        if(!email.includes("@mit.edu")){
            throw new Error("This email is not an MIT email. Please use an MIT email, otherwise you will not be able to join Infinite Clothing.");
        }



        const user: User = {
            username,
            email,
            password,
            token: this.generateRandomString(10),
            confirmed: false
        };

        this.users.push(user);

        return [user, user.token];
    }
}
