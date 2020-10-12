import { Channel, Message } from "amqplib"
import { Connection, Consumer, createChannelCallback } from "amqplib-plus"
import { Stats, StatsModel } from "../model/Stats"
import { Types } from 'mongoose'
import { Logger } from "winston"
import { Parser } from "fast-json-parser"

export interface configInit {
    rabbitExchangeName: string;
    rabbitExchangeType: string;
    rabbitQueueName: string;
    rabbitRoutKeyName: string;
}

//ui: string;
interface ProducerMessage {
    ep: string;
    me: string;
    sc: number;
    lt: number;
    rt: number;
}
//{ep: '/', me: 'GET', sc: 200, lt: 0.31, rt: 35} 

export class StatsController extends Consumer {

    private statsModel: StatsModel
    private statsModelQuery: typeof Stats

    constructor (amqpConn: Connection, prepareFn: createChannelCallback, logger: Logger, iniConf: configInit) {
        super(amqpConn, prepareFn, false, logger)
        this.statsModel = new Stats()
        this.statsModelQuery = Stats
    }

    processMessage(msg: Message, channel: Channel) {
        // console.log('Message headers:', JSON.stringify(msg.properties.headers))
        // console.log('Message body:', msg.content.toString(), '\n')

        const dataParse: ProducerMessage = Parser.parse(msg.content.toString())
        console.log(dataParse)
        const endpoint_p = dataParse.ep
        const metodo_p = dataParse.me
        const status_p = dataParse.sc
        const total_req_p = dataParse.rt
        const latencia_p = dataParse.lt

        /*
        this.statsModel.ep = dataParse.ep
        this.statsModel.me = dataParse.me
        this.statsModel.sc = dataParse.sc
        this.statsModel.lt = dataParse.lt
        this.statsModel.rt = dataParse.rt
        this.statsModel.save().then(async () => {
            const resultProccess = `{ep: '${dataParse.ep}', me: '${dataParse.me}', sc: ${dataParse.sc}, lt: ${dataParse.lt}, rt: 1}`;
            //await this.publisher.sendToQueue('pos-stats-consumer', Buffer.from(resultProccess), {})
            channel.ack(msg);
        }).catch(console.error)
        */

        const filter = {ep: endpoint_p, me: metodo_p, sc: status_p};
        const update = {rt: total_req_p, lt: latencia_p};

        //let doc = Stats.findOneAndUpdate(filter, update, {
        this.statsModelQuery.findOneAndUpdate(filter, update, {
            new: false,
            upsert: true // Make this update into an upsert
        }, (err, res) => {
            if (err) throw err

            console.log(res)
        });



        /*
       if (doc) {
        console.log('encontrado - atualizado')
       } else {
        console.log('NÃO encontrado - criado')
       }
       */
       channel.ack(msg);

        /*
        Stats.findOne({ep: dataParse.ep, me: dataParse.me, sc: dataParse.sc}, async (err, result) => {
            if (err) throw err

            if (!result) {
                console.log('CRIOU','\n')
                this.statsModel.ep = endpoint_p
                this.statsModel.me = metodo_p
                this.statsModel.sc = dataParse.sc
                this.statsModel.lt = dataParse.lt
                this.statsModel.rt = 1
                await this.statsModel.save().then(async () => {
                    const resultProccess = `{ep: '${dataParse.ep}', me: '${dataParse.me}', sc: ${dataParse.sc}, lt: ${dataParse.lt}, rt: 1}`;
                    //await this.publisher.sendToQueue('pos-stats-consumer', Buffer.from(resultProccess), {})
                    channel.ack(msg);
                })
            } else {
                //const newLtc = Math.round(result.lt * 100 ) / 100 + parseFloat(dataParse.lt)
                const newLtc = Math.round(result.lt * 100 ) / 100 + dataParse.lt
                const latMed = newLtc / 2 
                const latmefi = Math.round(latMed * 100 ) / 100
                const filter = {_id: Types.ObjectId(result._id)};
                const update = {
                    $set: {
                        ep: dataParse.ep, 
                        me: dataParse.me, 
                        sc: dataParse.sc,
                        lt: latmefi,
                    },
                    $inc: { rt: 1 }
                };
                let doc = await Stats.findOneAndUpdate(filter, update);
                if (doc) {
                    console.log(' =>>> ', doc)
                    const resultProccess = `{ep: '${doc.ep}', me: '${doc.me}', sc: ${doc.sc}, lt: ${doc.lt}, rt: ${doc.rt}}`;
                    //await this.publisher.sendToQueue('pos-stats-consumer', Buffer.from(resultProccess), {})
                    channel.ack(msg);
                } else {
                    console.log(' doc.ep nao encontrado ', doc)
                }
            }
        })
        */
    }
}