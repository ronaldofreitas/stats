import { Application } from "./app"
const app = new Application()
const config_init = {
    rabbitExchangeName: 'exchange1',
    rabbitExchangeType: 'direct',
    rabbitQueueName: 'pre-stats',
    rabbitRoutKeyName: 'routKey'
}
app.init(config_init)
