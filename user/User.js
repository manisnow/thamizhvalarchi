var mongoose = require('mongoose');  
mongoose.connect('mongodb://localhost/Thamiz-db',{ useNewUrlParser: true });
var UserSchema = new mongoose.Schema({  
  name: String,
  email: String,
  password: String,
  role: String,
  group: String
});
mongoose.model('User', UserSchema);
module.exports = mongoose.model('User');
