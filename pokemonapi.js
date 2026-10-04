import {require} from './utils.js'
import express from 'express'
import {pokedexRouter} from './routes/pokemons.js'
import {corsMiddleware} from './middlewares/cors.js'
import logger from 'morgan'
import {Server} from 'socket.io'
import {createServer} from 'node:http'
import cors from 'cors'
const { MongoClient, ServerApiVersion } = require('mongodb');
import { v4 as uuidv4 } from 'uuid';



const app = express();
app.use(corsMiddleware())
const server = createServer(app)
const io = new Server(server, {
    cors: { origin: ['http://localhost:5173','http://localhost:5175', 'http://localhost:8080', 'http://127.0.0.1:5173', 'https://liga-pokemon.vercel.app', "https://pokemon-league-pvp.vercel.app/", 'http://localhost:3000'], methods: ["GET", "POST"] },
    connectionStateRecovery: {}
});
const uri = "mongodb+srv://JonathanLazarte:Jonii1543104@pokemonleague.4awnj.mongodb.net/?retryWrites=true&w=majority&appName=PokemonLeague";
const localurl = 'mongodb://localhost:27017/'
const client = new MongoClient(localurl, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
   	//await client.close();
  }
}
run().catch(console.dir);


app.use(logger('dev'))
app.use(express.json())
app.use('/pokemons', pokedexRouter)

const adminUser = {
	userName: "ShakaDev (Administrador)",
	alias: "ShakaDev (admin)",
	tag: 'LAS',
	title: 'Admin',
	pokemon : [],
	items : [],
	messages: [],
	level: 1,
	EXP: 0,
	BE: 20000,
	RP: 3000,
	rank: {
		name: "Gold",
		level: 2,
		points: 1000
	},
	profileIcon: '6668',
	background: 'Shen_49',
}
const connectedUsers = [adminUser]
const usersChat = []
const rooms = {}
var queque = []

io.on('connection', (socket)=>{
	const dataBase = client.db("PokemonLeague")
	const usersCollection = dataBase.collection("users")

	console.log("un usuario ha sido conectado")
	
	socket.on('authenticate', async (credentials)=>{
		
		const isAlreadyLogged = connectedUsers.findIndex(connected => connected.userName == credentials.userName)
		const newUser = {
			socketID : socket.id,
		}

		isAlreadyLogged == -1 ? (
			await usersCollection.findOne({userName: credentials.userName}).then(data=>connectedUsers.push({...data, socketID: socket.id}))/*,
			connectedUsers.push(newUser)*/
		): console.log("Usuario actualmente logueado")

		io.emit('user-list', (connectedUsers))
		
	})
	socket.on('chat-message', (msg)=>{
		const foundUser = connectedUsers.find(cu => cu.userName == msg.to)
		const messageData = {
			message : msg.message,
			from : msg.from,
			to : foundUser?.userName
		}
		usersChat.push(msg)
		usersCollection.updateMany(
  		{ userName: { $in: [foundUser?.userName, msg.from] } }, // Filtro para seleccionar múltiples usuarios
  		{ $push: { messages: messageData } } // Operación para añadir el mensaje a cada usuario
		);
		io.to([foundUser.socketID, socket.id]).emit('chat-message', (messageData)) 
	})
	socket.on('battle-request', (msg)=>{
		const foundUser = connectedUsers.find(cu => cu.userName == msg.to)
		foundUser && io.to(foundUser.socketID).emit('battle-mailbox', (msg))
	})
	socket.on('attack', (msg)=>{
		io.to(msg.roomId).emit('attack', msg)
	})
	socket.on('selectpokemon', (msg)=>{
		io.to(msg.roomId).emit('selectpokemon', msg)
	})
	socket.on('setpokemon', (msg)=>{
		io.to(msg.roomId).emit('setpokemon', msg)
	})
	socket.on('player-ready', (msg)=>{
		io.to(msg.roomId).emit('player-ready', msg)
	})
	socket.on('join-room', (msg)=>{
		const existingRooms = Object.keys(rooms).filter(room => rooms[room].includes(socket.id));
    	if (existingRooms.length > 0) {
      	console.log('error', 'Ya estás en una sala');
      	return;
    } else {
		socket.join(msg.roomId);
		rooms[msg.roomId] = rooms[msg.roomId] || []
		rooms[msg.roomId].push(socket.id)
		const userJoined = connectedUsers.find(cu => cu.socketID == socket.id)
		//console.log("Se ha entrado a una sala")
		io.to(msg.roomId).emit('USER JOINED', ({room : rooms[msg.roomId], roomId : msg.roomId, userJoined}))
    }
		//console.log("ROOM: " + rooms[msg.roomId])
	/*if(rooms[msg.roomId].length == 2){
			io.to(msg.roomId).emit('USER JOINED', ({msg : rooms[msg.roomId], roomId : msg.roomId}))
		}*/
	})
	socket.on('leave-room', (msg)=>{
		const existingRooms = Object.keys(rooms).filter(room => rooms[room].includes(socket.id));
		const indexInRoom = rooms[existingRooms]?.findIndex(stringindex=> stringindex == socket.id)
		rooms[existingRooms]?.splice(indexInRoom,1)
		const newRoom = rooms[existingRooms]
		/*console.log("room: " + rooms[msg.roomId])
		console.log("newroom: " + newRoom)*/
		io.to(existingRooms).emit('USER-OUT',({newRoom}))


		const imAlreadyInQueque = queque.findIndex(q => q.id == socket.id)
		queque.splice(imAlreadyInQueque, 1)
		imAlreadyInQueque != -1 ? console.log("has sido desplazado del index: " + imAlreadyInQueque) : "No estabas en una cola"
	})

	socket.on('start-match', (msg)=>{
		io.to(msg.roomId).emit('start-match')
	})

	socket.on('disconnect', () => {
        // Eliminamos al usuario cuando se desconecta
        const newConnectedUsers = connectedUsers.findIndex(user => user.socketID == socket.id);
        newConnectedUsers != -1 && connectedUsers.splice(newConnectedUsers, 1)
        io.emit('user-list', connectedUsers);
        socket.leave();

        const existingRooms = Object.keys(rooms).filter(room => rooms[room].includes(socket.id));
        //const roomIndexInRooms = rooms[existingRooms].findIndex(existingRooms)
				const indexInRoom = rooms[existingRooms]?.findIndex(stringindex=> stringindex == socket.id)
				rooms[existingRooms]?.splice(indexInRoom,1)
				const newRoom = rooms[existingRooms]
				//console.log("room: " + rooms[existingRooms])
				//console.log("newroom: " + newRoom)
				io.to(existingRooms).emit('USER-OUT',({newRoom}))

				const imAlreadyInQueque = queque.findIndex(q => q.id == socket.id)
				queque.splice(imAlreadyInQueque, 1)
				imAlreadyInQueque != -1 ? console.log("has sido desplazado del index: " + imAlreadyInQueque) : "No estabas en una cola"
   });

	socket.on('find-opponent', (msg)=>{
				const imAlreadyInQueque = queque.find(q => q.id == socket.id)
				imAlreadyInQueque ? console.log("Ya estas en una cola") : queque.push({id: socket.id})
				if(queque.length >= 2){
					const roomId = uuidv4()
					io.to([socket.id, queque[0].id]).emit('find-opponent', {roomId: roomId})
					const playerIndex = queque.findIndex(player => player.id == socket.id)
					queque.splice(playerIndex, 1); queque.splice(0, 1)
					//io.to(queque[0]).emit('find-opponent', {roomId})
				} else { console.log("Has entrado en la cola") }

	})
})


const PORT = process.env.PORT ?? 5050
server.listen(PORT, ()=>console.log(`Server listening on ${PORT}`))
