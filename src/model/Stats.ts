import mongoose, { Document, Model, Schema } from 'mongoose';

interface IStats {
  _id?: string;
  endpoint: string;
  metodo: string;
  statusCode: number;
  latenciaMedia: number;
  totalRequests: number;
  dataAninhada: string;// data aninhada '2020091211' para facilitar a busca
  periodo: Date;
}

const StatsSchema = new Schema(
  {
    endpoint: { type: String, required: true },
    metodo: { type: String, required: true },
    statusCode: { type: Number, required: true },
    latenciaMedia: { type: Number, required: true },
    totalRequests: { type: Number, required: true },
    dataAninhada: { type: String, required: true },
    periodo: { type: Date, required: true }
  }
);

export interface StatsModel extends Omit<IStats, '_id'>, Document {}
export const Stats: Model<StatsModel> = mongoose.model('Stats', StatsSchema);