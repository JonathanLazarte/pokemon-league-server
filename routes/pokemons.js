import {Router} from 'express'
import {pokemonModel} from '../models/pokemon.js'
import {pokemonController, usersController} from '../controllers/pokemon.js'



export const pokedexRouter = Router()




pokedexRouter.get('/', pokemonController.getAll)

pokedexRouter.get('/:keys', pokemonController.searchByKeys)

pokedexRouter.get('/data/species', pokemonController.getSpecies)

pokedexRouter.post('/data/moves', pokemonController.getMoves)

pokedexRouter.get('/data/types', pokemonController.getTypes)

pokedexRouter.post('/users/register', usersController.registerUser)

pokedexRouter.post('/users/login', usersController.loginUser)

pokedexRouter.post('/users/getUserData', usersController.getUserData)

pokedexRouter.post('/users/pokemon', usersController.getAllOwned)

pokedexRouter.post('/users/addpokemon', usersController.addToPokedex)

pokedexRouter.post('/users/sellpokemon', usersController.sellPokemon)

pokedexRouter.post('/users/updatelevel', usersController.updateLevel)

pokedexRouter.post('/users/learnmove', usersController.learnMove)

pokedexRouter.post('/users/buyItem', usersController.buyItem)

pokedexRouter.post('/users/getItems', usersController.getItems)
