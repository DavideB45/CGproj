package assig6;

import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Enumeration;

public class Server {

    public static void main(String[] args) {

        ServerSocket sock;
        try {
            System.out.println(InetAddress.getLocalHost().getHostAddress());
            System.out.println(InetAddress.getLocalHost().getCanonicalHostName());
        } catch (UnknownHostException e) {
            e.printStackTrace();
            return;
        }
        try {
            sock = new ServerSocket(8080);
        } catch (IOException e) {
            e.printStackTrace();
            return;
        }
        Socket socket;

        while (true) {
            try {
                socket = sock.accept();
            } catch (IOException e) {
                e.printStackTrace();
                return;
            }
            if (!socket.isConnected()){
                continue;
            }
            try (OutputStream oStr = socket.getOutputStream(); BufferedReader iStr = new BufferedReader(new InputStreamReader(socket.getInputStream()))) {

                System.out.println("**************************");
                String request = iStr.readLine();
                System.out.println("Req  : " + request);
                if (!request.contains("GET")) {
                    oStr.write("HTTP/1.0 501 NOT IMPLEMENTED\n".getBytes(StandardCharsets.UTF_8));
                    System.out.println("**\nBad request\n**\n");
                    socket.close();
                    continue;
                }
                // ceck thge position of the file
                File toSend;
                if (!request.contains("common")) {
                    toSend = new File("./renderer_02" + request.split(" ")[1]);
                } else {
                    toSend = new File("." + request.split(" ")[1]);
                }

                if (!toSend.exists() || !toSend.isFile()){
                    oStr.write("HTTP/1.0 404 NOT FOUND\n".getBytes(StandardCharsets.UTF_8));
                    System.out.println("No such file");
                    System.out.println(toSend.toPath());
                    toSend = new File("./src/assig6/404file.html");
                } else {
                    oStr.write("HTTP/1.0 200 OK\n".getBytes(StandardCharsets.UTF_8));
                }
                FileInputStream fileInputStream = new FileInputStream(toSend);



                System.out.println("name : " + request.split(" ")[1]);
                byte[] byteInFile = new byte[(int) toSend.length()];
                fileInputStream.read(byteInFile);

                System.out.println("Type : " + Files.probeContentType(toSend.toPath()));
                oStr.write(("Content-Type: " + Files.probeContentType(toSend.toPath()) + "\n").getBytes(StandardCharsets.UTF_8));

                System.out.println("Dim  : " + toSend.length());
                oStr.write("Content-Length: ".getBytes(StandardCharsets.UTF_8));
                oStr.write(Integer.toString(byteInFile.length).getBytes(StandardCharsets.UTF_8));
                oStr.write("\n\n".getBytes(StandardCharsets.UTF_8));
                oStr.write(byteInFile);

                socket.close();
            } catch (IOException e) {
                e.printStackTrace();
            } catch (NullPointerException e){
                e.printStackTrace();
            }
        }
    }
}
