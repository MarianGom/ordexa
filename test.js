const bcryptjs = require('bcryptjs');


var salt = bcryptjs.genSaltSync(10);

var hash = bcryptjs.hashSync("Hola1234", salt);

console.log(bcryptjs.hashSync('Hola1234', salt));

console.log(hash)

console.log(bcryptjs.compareSync("Hola1234", hash));