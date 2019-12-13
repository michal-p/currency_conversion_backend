### Setup repository to program node backend part

### 1. git init
### 2. npm init
### 3. create index.js
### 4. npm install express --save
### 5. npm install --save-dev nodemon

### Deploy to Heroku

### Push Code to Heroku
## 1. FE deploy production build
```npm run build```
## 2. copy to backend
```cp -r build ../../../osa3/notes-backend```
## 3. Express show static content add to index.js
```app.use(express.static('build'))```
## 3. commit to master and push to Heroku
```git push heroku master```


### Setup enviroment variable
heroku config:set MONGODB_URI=mongodb+srv://fullstack:secred@cluster0-ostce.mongodb.net/note-app?retryWrites=true