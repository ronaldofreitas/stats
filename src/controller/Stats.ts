import { Channel, Message } from "amqplib"
import { Connection, Consumer, createChannelCallback } from "amqplib-plus"
import { Stats } from "../model/Stats"
import { Parser } from "fast-json-parser"
import logger from "../util/logger"

export interface configInit {
    rabbitExchangeName: string;
    rabbitExchangeType: string;
    rabbitQueueName: string;
    rabbitRoutKeyName: string;
}

//ui: string;
interface PublisherMessage {
    dt: string;
    ep: string;
    me: string;
    sc: number;
    lt: string;
    rt: number;
}

export class StatsController extends Consumer {

    constructor (amqpConn: Connection, prepareFn: createChannelCallback, iniConf: configInit) {
        super(amqpConn, prepareFn, false, logger)
    }

    processMessage(msg: Message, channel: Channel) {
        const 
            dataParse: PublisherMessage = Parser.parse(msg.content.toString()),
            data_p      = dataParse.dt,
            endpoint_p  = dataParse.ep,
            metodo_p    = dataParse.me,
            status_p    = dataParse.sc,
            total_req_p = dataParse.rt,
            latencia_p  = parseFloat(dataParse.lt),
            data_ano    = parseInt(data_p.substr(0, 4)),
            data_mes    = parseInt(data_p.substr(4, 2)),
            data_dia    = parseInt(data_p.substr(6, 2)),
            data_hor    = parseInt(data_p.substr(8, 2)),
            filter = {
                dataAninhada: data_p, 
                endpoint: endpoint_p, 
                metodo: metodo_p, 
                statusCode: status_p
            },
            update = {
                totalRequests: total_req_p, 
                latenciaMedia: latencia_p, 
                periodo: new Date(Date.UTC(data_ano, data_mes, data_dia, data_hor, 0, 0))
            }
        Stats.findOneAndUpdate(filter, update, {
            new: false,
            upsert: true
        }, (err, res) => {
            if (err) {
                logger.error(err)
                throw err
            }
            //logger.debug('_id: '+res._id)
            channel.ack(msg);
        })
    }
}