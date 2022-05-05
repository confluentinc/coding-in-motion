import { WebSocket } from 'ws';
import { v4 as uuid } from 'uuid';
import { CompressionCodecs, CompressionTypes, EachMessagePayload, Kafka } from 'kafkajs';
import { KAFKA_CONFIG, SCHEMA_REGISTRY_CONFIG } from './config';
import { SchemaRegistry } from '@kafkajs/confluent-schema-registry';

// @ts-ignore
import SnappyCodec from 'kafkajs-snappy';

CompressionCodecs[CompressionTypes.Snappy] = SnappyCodec;

const server = new WebSocket.Server({ port: 8080 });

const kafka = new Kafka(KAFKA_CONFIG);
const schemaRegistryClient = new SchemaRegistry(SCHEMA_REGISTRY_CONFIG);

server.on("connection", async (client) => {
    const groupId = uuid();
    const consumer = kafka.consumer({
        groupId
    });

    await consumer.connect();

    consumer.subscribe({ topic: 'midi_notes' });

    consumer.run({
        eachMessage: async ({ message }: EachMessagePayload) => {
            const key =
                message.key
                    ? message.key.toString()
                    : null;
            const value =
                message.value
                    ? await schemaRegistryClient.decode(message.value)
                    : null;

            client.send(JSON.stringify({ key, value }));
        }
    });
});
