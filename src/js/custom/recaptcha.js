import { load } from "recaptcha-v3";

(async () => {
	const recaptcha = await load("6LfK0JYqAAAAACn4qq-1KudtU3Yx77odbPPA76z7");

	const token = await recaptcha.execute("login");

	console.log(token);
})();