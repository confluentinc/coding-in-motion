import { SchemaRegistry } from '@kafkajs/confluent-schema-registry';
import { Kafka } from 'kafkajs';
import { WebMidi } from 'webmidi';
import { KAFKA_CONFIG, SCHEMA_REGISTRY_CONFIG } from './config';

async function runSynthStream() {
    await WebMidi.enable();

    const schemaRegistryClient = new SchemaRegistry(SCHEMA_REGISTRY_CONFIG);
    const rawMidiMessagesSchema = await schemaRegistryClient
        .getLatestSchemaId('raw_midi_messages-value');

    const kafka = new Kafka(KAFKA_CONFIG);
    const producer = kafka.producer();

    await producer.connect();

    WebMidi.inputs.forEach((input) => {

        input.addListener("midimessage", async (event) => {
            const [status, data1, data2] = event.message.data;

            if (status !== 248) {
                console.log("Message!", input.id, input.manufacturer, event);

                const key = input.id;
                const value = await schemaRegistryClient.encode(
                    rawMidiMessagesSchema,
                    {
                        SOURCE_MANUFACTURER: input.manufacturer,
                        STATUS: status,
                        DATA1: data1,
                        DATA2: data2
                    }
                );
                producer.send({
                    topic: 'raw_midi_messages',
                    messages: [{ key, value }]
                });
            }
        });
    });
};

runSynthStream();
