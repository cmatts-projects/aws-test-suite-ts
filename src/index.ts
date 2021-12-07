import SimpleEventHandler from '@/lambda/SimpleEventHandler';
import SqsEventHandler from "@/lambda/SqsEventHandler";
import LargeSqsEventHandler from "@/lambda/LargeSqsEventHandler";

module.exports = {
    simpleEventHandler: SimpleEventHandler.handleRequest,
    sqsEventHandler: SqsEventHandler.handleRequest,
    largeSqsEventHandler: LargeSqsEventHandler.handleRequest,
};
