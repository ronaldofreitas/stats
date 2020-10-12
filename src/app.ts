import * as database from './config/database-config'
import { configInit, StatsController } from './controller/Stats'
import { AmqpService } from './services/amqp-service'
import { Channel } from 'amqplib'
import logger from "./util/logger"

export class Application {

    public init(config: configInit): void {
        this.startUp(config)
    }

    private async initDatabase(): Promise<void> {
        try {
            await database.connect()
            logger.info('[DATABASE_CONNECT_SUCCESS]')
        } catch (error) {
            logger.error('[DATABASE_CONNECT_ERROR]')
            throw new Error('Database not connected')
        }
    }

    private async startUp(iniConf: configInit): Promise<void> {

        const amqpService = new AmqpService(logger)
        amqpService.shouldRecreateConnection(true)
        const amqpCon = amqpService.connect()

        amqpCon.then(async (c) => {

            c.on("close", (err) => { logger.warn('[AMQP_CLOSE]', err) })
            c.on("error", (err) => { logger.error('[AMQP_ERROR]', err) })

            const prepareConsumer = async (ch: Channel) => {
                await ch.assertQueue(iniConf.rabbitQueueName, { durable: false });
                await ch.assertExchange(iniConf.rabbitExchangeName, iniConf.rabbitExchangeType);
                await ch.bindQueue(iniConf.rabbitQueueName, iniConf.rabbitExchangeName, iniConf.rabbitRoutKeyName);
                await ch.prefetch(5);// quantidade de mensagem em 'espera' antes do ACK do consumer
                logger.info('[AMQP_CONSUMER_OK]')
            }

            logger.info('[AMQP_CONNECT_SUCCESS]')

            await this.initDatabase()

            const statsConsumer = new StatsController(amqpService, prepareConsumer, iniConf)
            statsConsumer.consume(iniConf.rabbitQueueName, {})
        }).catch(logger.error)
    }
}