import cors from 'cors'

const ACCEPTED_ORIGINS = [
			'null',
			'PostmanRuntime/7.42.0',
			'http://localhost:8080',
			'http//localhost:5050',
			'http://localhost:5174',
			'http://localhost:5173',
			'http://localhost:5175',
			'https://pokemonreact.onrender.com',
			'https://pokemonleagueappv2.onrender.com',
			'http://127.0.0.1:5173',
			'https://liga-pokemon.vercel.app',
			'http://localhost:3000',
			'https://pokemon-league-pvp.vercel.app',
			]
const ACCEPTED_METHODS = ['GET', 'POST', 'PUT', 'DELETE'];
export const corsMiddleware = ({acceptedOrigins = ACCEPTED_ORIGINS} = {}) => cors({
	origin:(origin, callback) => {
		
	
	if(ACCEPTED_ORIGINS.includes(origin)){
		return callback(null, true)
	}
	if(!origin){
		return callback(null, true)
	}
	if(origin == null){
		return callback(null, true)
	}

	return callback(new Error('Not allowed by CORS'))
	},
	methods: ACCEPTED_METHODS,
})