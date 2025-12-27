from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import JsonResponse

from .serializers import CreateRoomSerializer, RoomSerializer, UpdateRoomSerializer
from .models import Room

# Create your views here.


class RoomsView(generics.ListAPIView):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer


class CreateRoom(APIView):
    serializer_class = CreateRoomSerializer

    def post(self, request):
        sessionid = request.COOKIES.get("sessionid")
        print(" sessionid:", sessionid)

        # check if user has active session , if not , create it
        if not self.request.session.exists(self.request.session.session_key):  # pyright: ignore
            self.request.session.create()

        serializer = self.serializer_class(data=request.data)

        if serializer.is_valid():
            guest_can_pause = serializer.data.get('guest_can_pause')
            votes_to_skip = serializer.data.get('votes_to_skip')
            host = self.request.session.session_key
            queryset = Room.objects.filter(host=host)

            if queryset.exists():
                room = queryset[0]
                room.guest_can_pause = guest_can_pause
                room.votes_to_skip = votes_to_skip
                room.save(update_fields=['guest_can_pause', 'votes_to_skip'])
                self.request.session['room_code'] = room.code

                return Response(RoomSerializer(room).data, status=status.HTTP_200_OK)
            else:
                room = Room(
                    host=host,
                    guest_can_pause=guest_can_pause,
                    votes_to_skip=votes_to_skip,
                )

                room.save()
                self.request.session['room_code'] = room.code

            return Response(RoomSerializer(room).data, status=status.HTTP_201_CREATED)
        return Response(status=status.HTTP_418_IM_A_TEAPOT)


class GetRoom(APIView):  # This defines an API endpoint
    serializer_class = RoomSerializer

    def get(self, request, format=None):  # This HANDLES incoming GET requests
        code = request.GET.get('code')  # READS the query parameter from URL

        # Debug
        print(f"Session Key: {request.session.session_key}")
        print(f"Session Data: {dict(request.session)}")
        print(f"All cookies: {request.COOKIES}")

        if code is not None:
            room = Room.objects.filter(code=code)  # QUERIES the database
            if room:
                data = RoomSerializer(room[0]).data  # SERIALIZES the data to send back
                if self.request.session.session_key == room[0].host:
                    data['isHost'] = True
                else:
                    data['isHost'] = False
                return Response(data, status=status.HTTP_200_OK)

            return Response({'Room not Faunt': 'Invalid Code'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'Bad request': 'Code not in request'}, status=status.HTTP_400_BAD_REQUEST)


class JoinRoom(APIView):
    def post(self, request, format=None):
        # check if user has active session , if not , create it
        if not self.request.session.exists(self.request.session.session_key):  # pyright: ignore
            self.request.session.create()

        code = request.data.get('code')
        if code is not None:
            room_search = Room.objects.filter(code=code)
            if room_search:
                room = room_search[0]
                self.request.session['room_code'] = code
                return Response({'message': 'Room Joined'}, status=status.HTTP_202_ACCEPTED)

            return Response({'Bad request': ' No Room Found'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'Bad request': 'Invalid data'}, status=status.HTTP_400_BAD_REQUEST)


class UserInRoom(APIView):
    def get(self, request, format=None):
        # check session , or create
        if not self.request.session.exists(self.request.session.session_key):  # pyright: ignore
            self.request.session.create()

        # dbug
        print("Session key:", self.request.session.session_key)
        print("All session data:", dict(self.request.session))
        print("room_code value:", self.request.session.get('room_code'))

        data = {'code': self.request.session.get('room_code')}
        return JsonResponse(data, status=status.HTTP_200_OK)


class LeaveRoom(APIView):
    def post(self, request, format=None):
        if 'room_code' in self.request.session:
            self.request.session.pop('room_code')
            host_id = self.request.session.session_key
            room = Room.objects.filter(host=host_id)

            if room:
                room[0].delete()
                self.request.session.flush()
                return Response({'message': 'Room deleted'}, status=status.HTTP_200_OK)
        return Response({'message': 'left room'}, status=status.HTTP_200_OK)


class UpdateRoom(APIView):
    serializer_class = UpdateRoomSerializer

    def patch(self, request):
        if not self.request.session.exists(self.request.session.session_key):  # pyright: ignore
            self.request.session.create()

        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            guest_can_pause = serializer.data.get('guest_can_pause')
            votes_to_skip = serializer.data.get('votes_to_skip')

            code = serializer.data.get('code')
            query = Room.objects.filter(code=code)

            if not query.exists():
                return Response({'query': 'Room not found'}, status=status.HTTP_400_BAD_REQUEST)

            room = query[0]
            # check if host
            user_id = self.request.session.session_key
            if room.host != user_id:
                return Response({'Cant delete  room ': 'you are not host'}, status=status.HTTP_403_FORBIDDEN)

            room.guest_can_pause = guest_can_pause
            room.votes_to_skip = votes_to_skip
            room.save(update_fields=['guest_can_pause', 'votes_to_skip'])

            return Response(RoomSerializer(room).data, status=status.HTTP_200_OK)
        return Response({'Bad request': 'Invalid data'}, status=status.HTTP_400_BAD_REQUEST)
