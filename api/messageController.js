const Message = require('./../models/Message')


const list = (req, res) => {
  const { key } = req.body
  if(!key) return res.sendStatus(400)

  Message.find({ key }, (err, messages) => {
    if (err) { return res.send(500) }
    if (!messages) { return res.sendStatus(404) }

    return res.send({
      messages: messages.map(message => message.toClient())
    })
  })
}

module.exports = {
  list
}