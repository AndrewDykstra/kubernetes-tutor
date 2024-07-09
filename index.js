const Alexa = require('ask-sdk-core');
const axios = require('axios');

const KUBERNETES_TOPICS = {
    pods: 'Pods are the smallest, most basic deployable objects in Kubernetes. A Pod represents a set of running containers on your cluster.',
    services: 'Services in Kubernetes are an abstract way to expose an application running on a set of Pods as a network service.'
};

const KUBERNETES_COMMANDS = {
    'kubectl apply': 'The kubectl apply command applies a configuration to a resource by filename or stdin. JSON and YAML formats are accepted. Example: kubectl apply -f ./my-manifest.yaml',
    'kubectl get': 'The kubectl get command displays one or many resources. You can use it to list all pods, services, deployments, etc., in the cluster. Example: kubectl get pods',
    'kubectl describe': 'The kubectl describe command shows detailed information about a resource. It can be used for debugging and understanding the state of a resource. Example: kubectl describe pod my-pod',
    'kubectl logs': 'The kubectl logs command prints the logs for a container in a pod. This is useful for debugging and monitoring applications. Example: kubectl logs my-pod',
    'kubectl exec': 'The kubectl exec command runs a command in a container. It can be used for debugging or running one-off commands. Example: kubectl exec -it my-pod -- /bin/bash',
    'kubectl delete': 'The kubectl delete command deletes resources by file names, stdin, resources, and names. You can specify the type and name of the resource to delete. Example: kubectl delete pod my-pod',
    'kubectl scale': 'The kubectl scale command updates the size of the deployment, replica set, or replication controller. Example: kubectl scale --replicas=3 deployment/my-deployment',
    'kubectl rollout': 'The kubectl rollout command manages the rollout of a deployment. It includes subcommands like kubectl rollout status, kubectl rollout history, and kubectl rollout undo. Example: kubectl rollout status deployment/my-deployment',
    'kubectl port-forward': 'The kubectl port-forward command forwards one or more local ports to a pod. This is useful for accessing a service running in a pod from your local machine. Example: kubectl port-forward pod/my-pod 8080:80',
    'kubectl apply set-last-applied': 'The kubectl apply set-last-applied command updates the annotation on a resource to match the contents of a file. This is useful for managing resource configurations. Example: kubectl apply set-last-applied -f ./my-manifest.yaml',
    'kubectl create': 'The kubectl create command creates a resource from a file or from stdin. JSON and YAML formats are accepted. Example: kubectl create -f ./my-manifest.yaml',
    'kubectl config': 'The kubectl config command modifies kubeconfig files. It is used to view and set cluster authentication information. Example: kubectl config set-context my-context',
    'kubectl top': 'The kubectl top command displays resource (CPU/Memory/Storage) usage. This is useful for monitoring the resource usage of nodes and pods. Example: kubectl top pods',
};

const GetKubernetesTopicHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'GetKubernetesTopic';
    },
    handle(handlerInput) {
        const topic = handlerInput.requestEnvelope.request.intent.slots.topic.value.toLowerCase();
        const response = KUBERNETES_TOPICS[topic] || `I don't have information about ${topic}. Please ask about another Kubernetes topic and I'll see if  I can help.`;
        return handlerInput.responseBuilder
            .speak(response)
            .getResponse();
    }
};

const GetKubernetesCommandHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'GetKubernetesCommand';
    },
    handle(handlerInput) {
        const command = handlerInput.requestEnvelope.request.intent.slots.command.value.toLowerCase();
        const response = KUBERNETES_COMMANDS[command] || `I don't have information about the ${command} command. Please ask about another Kubernetes command.`;
        return handlerInput.responseBuilder
            .speak(response)
            .getResponse();
    }
};

const AskGPTHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AskGPT';
    },
    async handle(handlerInput) {
        const question = handlerInput.requestEnvelope.request.intent.slots.question.value;
        const gptResponse = await axios.post('https://api.openai.com/v1/engines/davinci-codex/completions', {
            prompt: `How would I ${question} with Kubernetes?`,
            max_tokens: 100
        }, {
            headers: {
                'Authorization': `Bearer OpenAI-Key-Removed-For-Privacy`
            }
        });

        const response = gptResponse.data.choices[0].text.trim();
        return handlerInput.responseBuilder
            .speak(response)
            .getResponse();
    }
};

const HelpHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
               handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speechText = 'You can ask me about different Kubernetes topics or commands. For example, say "Tell me about pods". Or ask about a specific kubernetes command like "kubectl apply".';

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};

const CancelAndStopHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
               (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent' ||
                handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speechText = 'Goodbye!';
        return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();
    }
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`Error handled: ${error.message}`);
        const speechText = 'Sorry, I can\'t understand the command you said. Please try to say it again.';

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        GetKubernetesTopicHandler,
        GetKubernetesCommandHandler,
        AskGPTHandler,
        HelpHandler,
        CancelAndStopHandler
    )
    .addErrorHandlers(ErrorHandler)
    .lambda();
