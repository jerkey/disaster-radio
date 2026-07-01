#include "LoRaClient.h"

bool LoRaClient::init()
{
    LL2->init(); // initialize Layer2
    return true;
}

void LoRaClient::broadcastRoutes()
{
    int numRoutes = LL2->getRouteEntry();
    if (numRoutes <= 0) return;

    // message: 2-byte fixed ID + "r|" + 6 bytes per route entry
    // 6 bytes per entry: 4-byte destination address + 1-byte distance + 1-byte metric
    struct Datagram datagram = {0};
    datagram.type = 'r';
    uint8_t *msg = datagram.message;
    msg[0] = 0x0f;
    msg[1] = 0x0f;
    msg[2] = 'r';
    msg[3] = '|';
    int offset = 4;

    for (int i = 0; i < numRoutes && offset + 6 <= (int)MESSAGE_LENGTH; i++)
    {
        memcpy(msg + offset, LL2->_routeTable[i].destination, ADDR_LENGTH);
        offset += ADDR_LENGTH;
        msg[offset++] = LL2->_routeTable[i].distance;
        msg[offset++] = LL2->_routeTable[i].metric;
    }

    memcpy(datagram.destination, BROADCAST, ADDR_LENGTH);
    server->transmit(this, datagram, offset + DATAGRAM_HEADER);
}

void LoRaClient::loop()
{
    LL2->daemon();
    struct Packet packet = LL2->readData();
    if (packet.totalLength > HEADER_LENGTH)
    {
        server->transmit(this, packet.datagram, packet.totalLength - HEADER_LENGTH);
    }

    unsigned long now = millis();
    if (now - _lastRouteBroadcast >= 10000)
    {
        _lastRouteBroadcast = now;
        broadcastRoutes();
    }
}

void LoRaClient::receive(struct Datagram datagram, size_t len)
{
    struct Datagram response = {0};
    int value;
    double value2;
    long value3;
    long ret;
    size_t msgLen;

    // forward all messages to LL2, except those of type 'i'(info)
    if(datagram.type == 'i'){
        if(memcmp(&datagram.message[0], "addr", 4) == 0){
            char localAddr[8] = {'\0'};
            LL2->getLocalAddress(localAddr);
            memcpy(response.destination, BROADCAST, ADDR_LENGTH);
            response.type = 'i';
            msgLen = snprintf((char *)response.message, MESSAGE_LENGTH, "%s", localAddr);
            if (msgLen >= MESSAGE_LENGTH) msgLen = MESSAGE_LENGTH - 1; // snprintf returns would-be length, not written length
            server->transmit(this, response, msgLen + DATAGRAM_HEADER);
        }
        else if(memcmp(&datagram.message[0], "lora", 4) == 0){
            char r_table[2400] = {'\0'}; // up to 40 routes * ~55 chars/route + header
            LL2->getRoutingTable(r_table);
            memcpy(response.destination, BROADCAST, ADDR_LENGTH);
            response.type = 'i';
            // r_table can exceed the 234-byte datagram message; snprintf truncates
            // instead of overflowing response.message's stack buffer (was a crash bug)
            msgLen = snprintf((char *)response.message, MESSAGE_LENGTH, "%s", r_table);
            if (msgLen >= MESSAGE_LENGTH) msgLen = MESSAGE_LENGTH - 1; // snprintf returns would-be length, not written length
            server->transmit(this, response, msgLen + DATAGRAM_HEADER);
        }
        else if(memcmp(&datagram.message[0], "config", 5) == 0){
            char config[256] = {'\0'};
            LL2->getCurrentConfig(config);
            memcpy(response.destination, BROADCAST, ADDR_LENGTH);
            response.type = 'i';
            // config can be >= 234 bytes; snprintf truncates instead of overflowing
            // response.message's stack buffer (was a crash bug)
            msgLen = snprintf((char *)response.message, MESSAGE_LENGTH, "%s", config);
            if (msgLen >= MESSAGE_LENGTH) msgLen = MESSAGE_LENGTH - 1; // snprintf returns would-be length, not written length
            server->transmit(this, response, msgLen + DATAGRAM_HEADER);
        }
        else if(memcmp(&datagram.message[0], "txpower", 7) == 0){
            sscanf((char *)&datagram.message[8], "%d", &value);
            ret = LL2->setTxPower(value, 1);
            memcpy(response.destination, BROADCAST, ADDR_LENGTH);
            response.type = 'i';
            if(ret > 0){
                msgLen = sprintf((char *)response.message, "TxPower on LoRa%ld set to %ddB\r\n", ret, value);
            }
            else{
                msgLen = sprintf((char *)response.message, "TxPower setting failed\r\n");
            }
            server->transmit(this, response, msgLen + DATAGRAM_HEADER);
        }
        else if(memcmp(&datagram.message[0], "sf", 2) == 0){
            sscanf((char *)&datagram.message[3], "%d", &value);
            ret = LL2->setSpreadingFactor(value, 1);
            memcpy(response.destination, BROADCAST, ADDR_LENGTH);
            response.type = 'i';
            if(ret > 0){
                msgLen = sprintf((char *)response.message, "SpreadingFactor on LoRa%ld set to %d\r\n", ret, value);
            }
            else{
                msgLen = sprintf((char *)response.message, "SpreadingFactor setting failed\r\n");
            }
            server->transmit(this, response, msgLen + DATAGRAM_HEADER);
        }
        else if(memcmp(&datagram.message[0], "duty", 4) == 0){
            sscanf((char *)&datagram.message[5], "%lf", &value2);
            LL2->setDutyCycle(value2);
            memcpy(response.destination, BROADCAST, ADDR_LENGTH);
            response.type = 'i';
            msgLen = sprintf((char *)response.message, "Duty Cycle of LL2 set to %lf\r\n", value2);
            server->transmit(this, response, msgLen + DATAGRAM_HEADER);
        }
        else if(memcmp(&datagram.message[0], "interval", 8) == 0){
            sscanf((char *)&datagram.message[9], "%ld", &value3);
            ret = LL2->setInterval(value3);
            memcpy(response.destination, BROADCAST, ADDR_LENGTH);
            response.type = 'i';
            if(ret > 0){
              msgLen = sprintf((char *)response.message, "Routing mode set to `auto`, interval of routing table messages set to %ld\r\n", ret);
            }
            else if(ret == 0){
              msgLen = sprintf((char *)response.message, "Routing table messages disabled, routing mode set to `manual`\r\n");
            }
            server->transmit(this, response, msgLen + DATAGRAM_HEADER);
        }
    }
    else{
      LL2->writeData(datagram, len);
    }
}
